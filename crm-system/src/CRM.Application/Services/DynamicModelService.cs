using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Dynamics;
using CRMSys.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Shared.Dapper.Interfaces;
using System.Collections.Concurrent;
using System.Reflection;

namespace CRMSys.Application.Services
{
    public class DynamicModelService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ConcurrentDictionary<int, Type> _typeCache = new();
        private readonly ConcurrentDictionary<string, int> _modalNameCache = new();
        private readonly SemaphoreSlim _loadLock = new(1, 1);
        private bool _isLoaded = false;

        private static readonly Assembly DynamicsAssembly = typeof(RSVNModelBase).Assembly;

        public DynamicModelService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        private async Task LoadTypeMapping()
        {
            if (_isLoaded) return;

            await _loadLock.WaitAsync();
            try
            {
                if (_isLoaded) return;

                await using var scope = _scopeFactory.CreateAsyncScope();
                var repo = scope.ServiceProvider.GetRequiredService<IRepository<ReferenceTypes, long>>();
                var referenceTypes = await repo.GetAllAsync();

                foreach (var refType in referenceTypes)
                {
                    var type = FindType(refType.Model!);
                    if (type != null && type.IsSubclassOf(typeof(RSVNModelBase)))
                    {
                        _typeCache[refType.Id] = type;
                        _modalNameCache[refType.Model!] = refType.Id;
                    }
                }

                _isLoaded = true;
                Log.Information("DynamicModelService loaded {0} model types", _typeCache.Count);
            }
            finally
            {
                _loadLock.Release();
            }
        }

        private Type? FindType(string typeName)
        {
            var type = DynamicsAssembly
                .GetTypes()
                .FirstOrDefault(t =>
                    t.Name.Equals(typeName, StringComparison.OrdinalIgnoreCase) &&
                    t.Namespace != null &&
                    t.Namespace.StartsWith("CRMSys.Domain.Dynamics"));

            if (type != null)
            {
                Log.Information("FindType...{0} - {1}", typeName, type.FullName);
                return type;
            }

            Log.Warning("FindType not found: {0}", typeName);
            return null;
        }

        public async Task<RSVNModelBase> GetModelInstance(int typeId)
        {
            await LoadTypeMapping();

            if (_typeCache.TryGetValue(typeId, out var type))
                return Activator.CreateInstance(type) as RSVNModelBase
                       ?? throw new InvalidOperationException($"Cannot create instance of {type}");

            throw new ArgumentException($"Type ID {typeId} not found in database");
        }

        public async Task<Type> GetModelType(int typeId)
        {
            await LoadTypeMapping();
            if (_typeCache.TryGetValue(typeId, out var type))
                return type;

            throw new ArgumentException($"Type ID {typeId} not found in database");
        }

        public async Task<Type> GetModelTypeByModalName(string modalName)
        {
            await LoadTypeMapping();

            if (_modalNameCache.TryGetValue(modalName, out var refType) &&
                _typeCache.TryGetValue(refType, out var type))
            {
                return type;
            }

            throw new ArgumentException($"Model '{modalName}' not found in cache or database");
        }

        public int? GetRefTypeByModalName(string modalName)
        {
            return _modalNameCache.TryGetValue(modalName, out var refType) ? refType : null;
        }

        public bool TryGetModelType(int typeId, out Type modelType)
        {
            return _typeCache.TryGetValue(typeId, out modelType);
        }

        public async Task RefreshTypeMapping()
        {
            _typeCache.Clear();
            _modalNameCache.Clear();
            _isLoaded = false;
            await LoadTypeMapping();
        }
    }
}
